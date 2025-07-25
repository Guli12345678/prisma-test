import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createOrderDto: CreateOrderDto) {
    const user = await this.prismaService.user.findUnique({
      where: { id: createOrderDto.userId },
    });
    if (!user) {
      throw new NotFoundException("Bunday foydalanuvchi mavjud emas");
    }
    return this.prismaService.order.create({
      data: {
        total: createOrderDto.total,
        user: { connect: { id: createOrderDto.userId } },
      },
    });
  }

  findAll() {
    return this.prismaService.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findOne(id: number) {
    return this.prismaService.order.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.prismaService.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  remove(id: number) {
    return this.prismaService.order.delete({ where: { id } });
  }
}
