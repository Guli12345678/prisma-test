import {
  BadRequestException,
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
import { Request, Response } from "express";
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
    if (!user) throw new NotFoundException("User not found");

    const isValid = await bcrypt.compare(password, user.hashed_password);
    if (!isValid)
      throw new UnauthorizedException("Email or password is incorrect");

    const { accessToken, refreshToken } = await this.generateTokensuser(user);
    if (!refreshToken)
      throw new UnauthorizedException("Refresh token generation failed");

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { hashed_refresh_token: hashedRefreshToken },
    });

    res.cookie("refresh_token", refreshToken, {
      maxAge: +process.env.COOKIE_TIME!,
      httpOnly: true,
    });

    return {
      message: "User signed in 🎉",
      userId: user.id,
      accessToken,
    };
  }

  async signOut(email: string, password: string): Promise<{ message: string }> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    const isPasswordValid = await bcrypt.compare(
      password,
      user.hashed_password
    );
    if (!isPasswordValid) throw new Error("Invalid password");

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { hashed_refresh_token: null },
    });

    return { message: "User signed out successfully 🍉" };
  }

  async refreshUserToken(req: Request, res: Response) {
    const refresh_token = req.cookies?.refresh_token;

    if (!refresh_token) {
      throw new BadRequestException("Refresh token is required");
    }
    let decoded: any;
    try {
      decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_KEY!);
    } catch (err) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.usersService.findOne(decoded.id);

    if (!user || !user.hashed_refresh_token) {
      throw new UnauthorizedException("User not found or token missing");
    }

    const isMatch = await bcrypt.compare(
      refresh_token,
      user.hashed_refresh_token
    );
    if (!isMatch) {
      throw new UnauthorizedException("Token mismatch");
    }

    const payload = { id: user.id };
    const newAccessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_KEY!, {
      expiresIn: 150000000,
    });

    const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY!, {
      expiresIn: 300000000,
    });
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { hashed_refresh_token: await bcrypt.hash(refresh_token, 7) },
    });
    res.cookie("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
    });

    return {
      message: "User accessToken refreshed",
      access_token: newAccessToken,
    };
  }
}
