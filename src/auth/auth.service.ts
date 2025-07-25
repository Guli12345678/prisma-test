import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "../users/dto";
import { UsersService } from "../users/users.service";
import { SignInUserDto } from "../users/dto/sign-user.dto";
import { Response } from "express";
import { User } from "../../generated/prisma";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) {}
  async signUp(createUserDto: CreateUserDto) {
    const email = createUserDto.email;

    const candidate = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (candidate) {
      throw new ConflictException("This user already exists");
    }

    const newUser = await this.usersService.create(createUserDto);
    return { message: "User registered successfully", user: newUser };
  }

  async generateTokensuser(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.SECRET_TOKEN_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signin(signInUserDto: SignInUserDto, res: Response) {
    const { email, password } = signInUserDto;
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const isValid = await bcrypt.compare(
      signInUserDto.password,
      user.hashed_password
    );

    if (!isValid) {
      throw new UnauthorizedException(
        "Email or password is incorrect. Check your email and password"
      );
    }

    const { accessToken, refreshToken } = await this.generateTokensuser(user);
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token generation failed");
    }
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { hashed_refresh_token: await bcrypt.hash(refreshToken, 7) },
    });
    res.cookie("refresh_token", refreshToken, {
      maxAge: +process.env.COOKIE_TIME!,
      httpOnly: true,
    });

    return {
      message: "User signed in 🎉",
      customerId: user.id,
      accessToken,
    };
  }

  async signOut(userId: number, res: Response) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { hashed_refresh_token: null },
    });

    res.clearCookie("refresh_token");

    return { message: "User signed out successfully 🍉" };
  }

  async refreshTokens(refreshToken: string, res: Response) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_KEY,
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
      });

      if (!user || !user.hashed_refresh_token) {
        throw new UnauthorizedException("Refresh: user not found");
      }

      const isMatch = await bcrypt.compare(
        refreshToken,
        user.hashed_refresh_token
      );
      if (!isMatch) {
        throw new UnauthorizedException("Refresh token is invalid");
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await this.generateTokensuser(user);

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { hashed_refresh_token: await bcrypt.hash(newRefreshToken, 7) },
      });

      res.cookie("refresh_token", newRefreshToken, {
        maxAge: +process.env.COOKIE_TIME!,
        httpOnly: true,
      });

      return {
        accessToken,
        customerId: user.id,
        message: "Token refreshed successfully 🔄",
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
