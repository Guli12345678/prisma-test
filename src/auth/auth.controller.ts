import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../users/dto";
import { Request, Response } from "express";
import { SignInUserDto } from "../users/dto/sign-user.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signUp(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post("signin")
  async signin(@Body() signInUserDto: SignInUserDto, @Res() res: Response) {
    try {
      const result = await this.authService.signin(signInUserDto, res);
      return res.status(200).send(result);
    } catch (error) {
      console.error("Signin Error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  @Post("refresh-token")
  customerRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.authService.refreshUserToken(req, res);
  }

  @Post("signout")
  async signOut(
    @Body() body: { email: string; password: string },
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.signOut(body.email, body.password);
      res.clearCookie("refresh_token");
      return res.status(200).json(result);
    } catch (error) {
      console.error("Signout Error:", error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
