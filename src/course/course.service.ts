import { Injectable } from "@nestjs/common";
import { CreateCourseDto } from "./dto/create-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CourseService {
  constructor(private readonly prismaService: PrismaService) {}
  // create(createCourseDto: CreateCourseDto) {
  //   return this.prismaService.course.create({
  //     data: {
  //       title: createCourseDto.title,
  //       student_courses: createCourseDto.student_courses,
  //     },
  //   });
  // }

  findAll() {
    return this.prismaService.course.findMany({
      include: { student_courses: true },
    });
  }

  findOne(id: number) {
    return this.prismaService.course.findUnique({
      where: { id },
      include: { student_courses: true },
    });
  }

  // update(id: number, updateCourseDto: UpdateCourseDto) {
  //   return this.prismaService.course.update({
  //     where: { id },
  //     data: updateCourseDto,
  //   });
  // }

  remove(id: number) {
    return this.prismaService.course.delete({ where: { id } });
  }
}
