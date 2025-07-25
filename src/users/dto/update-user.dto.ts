import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  confirm_password?: string;
}
