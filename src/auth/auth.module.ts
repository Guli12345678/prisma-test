import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    JwtModule.register({}),
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
