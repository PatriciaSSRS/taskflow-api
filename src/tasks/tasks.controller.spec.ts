import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskStatus } from './task.entity';

const mockTask: Task = {
  id: 'a1b2c3',
  title: 'Escrever testes',
  description: undefined,
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TasksController', () => {
  let controller: TasksController;
  let service: jest.Mocked<TasksService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TasksController);
    service = module.get(TasksService);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create delega para o service', () => {
    service.create.mockResolvedValue(mockTask);
    const dto = { title: mockTask.title };

    expect(controller.create(dto)).resolves.toEqual(mockTask);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('findAll repassa os filtros de status e prioridade', () => {
    service.findAll.mockResolvedValue([mockTask]);

    expect(
      controller.findAll(TaskStatus.TODO, TaskPriority.MEDIUM),
    ).resolves.toEqual([mockTask]);
    expect(service.findAll).toHaveBeenCalledWith({
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    });
  });

  it('findOne delega para o service com o id', () => {
    service.findOne.mockResolvedValue(mockTask);

    expect(controller.findOne(mockTask.id)).resolves.toEqual(mockTask);
    expect(service.findOne).toHaveBeenCalledWith(mockTask.id);
  });

  it('update delega para o service com id e dto', () => {
    service.update.mockResolvedValue(mockTask);
    const dto = { status: TaskStatus.DONE };

    expect(controller.update(mockTask.id, dto)).resolves.toEqual(mockTask);
    expect(service.update).toHaveBeenCalledWith(mockTask.id, dto);
  });

  it('remove delega para o service com o id', () => {
    service.remove.mockResolvedValue(undefined);

    expect(controller.remove(mockTask.id)).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(mockTask.id);
  });
});
