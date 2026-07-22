import { customersRepository } from './customers.repository';
import { ApiError } from '../../shared/utils/ApiError';
import { generateCustomerCode } from '../../shared/utils/codegen';
import { logActivity } from '../../shared/services/activity.service';
import { parsePagination, buildPaginationMeta } from '../../shared/utils/pagination';
import {
  CreateCustomerInput, UpdateCustomerInput, CreateContactInput,
  CreateNoteInput, CreateFollowUpInput, UpdateFollowUpInput, ListCustomersQuery,
} from './customers.schema';

export const customersService = {
  async list(query: ListCustomersQuery) {
    const pagination = parsePagination(query);
    const [customers, total] = await customersRepository.findMany({
      skip: pagination.skip, take: pagination.take, search: query.search,
      tag: query.tag, isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    });
    return { data: customers, meta: buildPaginationMeta(total, pagination.page, pagination.limit) };
  },

  async getById(id: string) {
    const customer = await customersRepository.findById(id);
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  },

  async create(input: CreateCustomerInput, actorId: string, ipAddress?: string) {
    const existingPhone = await customersRepository.findByCodeOrPhone(input.phone);
    if (existingPhone) throw ApiError.conflict(`A customer with phone number ${input.phone} already exists`);

    const code = await generateCustomerCode();
    const customer = await customersRepository.create({ ...input, code, createdById: actorId });
    await logActivity({
      userId: actorId, action: 'CUSTOMER_CREATED', entityType: 'Customer',
      entityId: customer.id, entityLabel: `${customer.name} (${customer.code})`,
      metadata: { creditLimit: customer.creditLimit, tags: customer.tags }, ipAddress,
    });
    return customer;
  },

  async update(id: string, input: UpdateCustomerInput, actorId: string, ipAddress?: string) {
    const existing = await customersRepository.findById(id);
    if (!existing) throw ApiError.notFound('Customer not found');
    if (input.phone && input.phone !== existing.phone) {
      const phoneTaken = await customersRepository.findByCodeOrPhone(input.phone, id);
      if (phoneTaken) throw ApiError.conflict('Phone number is already associated with another customer');
    }
    const updated = await customersRepository.update(id, input as never);
    await logActivity({
      userId: actorId, action: 'CUSTOMER_UPDATED', entityType: 'Customer',
      entityId: updated.id, entityLabel: `${updated.name} (${updated.code})`,
      metadata: { changes: Object.keys(input) }, ipAddress,
    });
    return updated;
  },

  async addContact(customerId: string, input: CreateContactInput) {
    await this.getById(customerId);
    return customersRepository.addContact(customerId, { customerId, name: input.name, phone: input.phone, email: input.email, designation: input.designation, isPrimary: input.isPrimary });
  },

  async addNote(customerId: string, input: CreateNoteInput, actorId: string) {
    const customer = await this.getById(customerId);
    const note = await customersRepository.addNote(customerId, actorId, input.content, input.isPinned);
    await logActivity({
      userId: actorId, action: 'NOTE_ADDED', entityType: 'Customer',
      entityId: customerId, entityLabel: `${customer.name} (${customer.code})`,
      metadata: { isPinned: input.isPinned },
    });
    return note;
  },

  async deleteNote(customerId: string, noteId: string) {
    await this.getById(customerId);
    return customersRepository.deleteNote(noteId);
  },

  async addFollowUp(customerId: string, input: CreateFollowUpInput, actorId: string) {
    const customer = await this.getById(customerId);
    const followUp = await customersRepository.addFollowUp(customerId, actorId, { title: input.title, description: input.description, scheduledAt: new Date(input.scheduledAt) });
    await logActivity({
      userId: actorId, action: 'FOLLOW_UP_ADDED', entityType: 'Customer',
      entityId: customerId, entityLabel: `${customer.name} (${customer.code})`,
      metadata: { title: input.title, scheduledAt: input.scheduledAt },
    });
    return followUp;
  },

  async updateFollowUp(customerId: string, followUpId: string, input: UpdateFollowUpInput, actorId: string) {
    const customer = await this.getById(customerId);
    const followUp = await customersRepository.updateFollowUp(followUpId, input.status, input.description);
    if (input.status === 'COMPLETED') {
      await logActivity({
        userId: actorId, action: 'FOLLOW_UP_COMPLETED', entityType: 'Customer',
        entityId: customerId, entityLabel: `${customer.name} (${customer.code})`,
        metadata: { followUpId },
      });
    }
    return followUp;
  },

  async getTimeline(customerId: string) {
    await this.getById(customerId);
    return customersRepository.getTimeline(customerId);
  },
};
