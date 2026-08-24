import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskStatus } from './task.entity';

const mockTask: Task = {
  id: 'a1b2c3',
  title: 'Configurar pipeline de CI',
  description: 'Criar workflow no GitHub Actions',
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  createdAt: new Date(),
  updatedAt: new Date(),
};

type MockRepository = Partial<Record<keyof Repository<Task>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('TasksService', () => {
  let service: TasksService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(getRepositoryToken(Task));
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  it('deve criar uma tarefa', async () => {
    repository.create!.mockReturnValue(mockTask);
    repository.save!.mockResolvedValue(mockTask);

    const result = await service.create({ title: mockTask.title });

    expect(repository.create).toHaveBeenCalledWith({ title: mockTask.title });
    expect(repository.save).toHaveBeenCalledWith(mockTask);
    expect(result).toEqual(mockTask);
  });

  it('deve listar tarefas aplicando filtros', async () => {
    repository.find!.mockResolvedValue([mockTask]);

    const result = await service.findAll({ status: TaskStatus.TODO });

    expect(repository.find).toHaveBeenCalledWith({
      where: { status: TaskStatus.TODO },
    });
    expect(result).toEqual([mockTask]);
  });

  it('deve retornar uma tarefa pelo id', async () => {
    repository.findOne!.mockResolvedValue(mockTask);

    const result = await service.findOne(mockTask.id);

    expect(result).toEqual(mockTask);
  });

  it('deve lançar NotFoundException quando a tarefa não existir', async () => {
    repository.findOne!.mockResolvedValue(null);

    await expect(service.findOne('id-inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve remover uma tarefa existente', async () => {
    repository.findOne!.mockResolvedValue(mockTask);
    repository.remove!.mockResolvedValue(mockTask);

    await service.remove(mockTask.id);

    expect(repository.remove).toHaveBeenCalledWith(mockTask);
  });
});
