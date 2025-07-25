import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { OrdersModule } from "./orders/orders.module";
import { StudentsModule } from "./students/students.module";
import { StudentCourseModule } from "./student_course/student_course.module";
import { CourseModule } from './course/course.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    StudentsModule,
    StudentCourseModule,
    CourseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
