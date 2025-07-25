import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto, UpdateUserDto } from "./dto";
import * as bcrypt from "bcrypt";
@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createUserDto: CreateUserDto) {
    const { name, email, phone, password, confirm_password } = createUserDto;
    if (password !== confirm_password) {
      throw new Error("Passwords do not match");
    }
    const hashed_Password = bcrypt.hashSync(password, 7);

    return this.prismaService.user.create({
      data: {
        name,
        email,
        phone,
        hashed_password: hashed_Password,
      },
    });
  }

  findAll() {
    return this.prismaService.user.findMany({ include: { orders: true } });
  }

  findOne(id: number) {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: number) {
    return this.prismaService.user.delete({ where: { id } });
  }
}
