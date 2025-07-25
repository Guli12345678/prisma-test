import { Injectable } from "@nestjs/common";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}
  create(createStudentDto: CreateStudentDto) {
    return this.prismaService.student.create({
      data: {
        name: createStudentDto.name,
        student_courses: { connect: { id: createStudentDto.student_course } },
      },
    });
  }

  findAll() {
    return this.prismaService.student.findMany({
      include: { student_courses: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.student.findUnique({
      where: { id },
      include: { student_courses: true },
    });
  }

  update(id: number, updateStudentDto: UpdateStudentDto) {
    return this.prismaService.student.update({
      where: { id },
      data: updateStudentDto,
    });
  }

  remove(id: number) {
    return this.prismaService.student.delete({ where: { id } });
  }
}
