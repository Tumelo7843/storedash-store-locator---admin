import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toOrderDTO } from '../utils/mappers.js';
import { createOrderSchema, listOrdersQuerySchema, updateOrderStatusSchema } from '../validators/orders.validator.js';
import { idParamSchema } from '../validators/common.js';
import * as ordersService from '../services/orders.service.js';
import { getStoreIdsManagedByUser } from '../services/storeAccess.service.js';
import { AppError } from '../utils/errors.js';

export const placeOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { storeId, items } = createOrderSchema.parse(req.body);
  const { order, items: orderItems } = await ordersService.placeOrder(req.authUser!, storeId, items);
  res.status(201).json({ data: toOrderDTO(order, orderItems) });
});

export const listMyOrders = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const { rows, total } = await ordersService.listOrders({ ...query, userId: req.authUser!.id });
  const data = await Promise.all(rows.map(async (o) => toOrderDTO(o, await ordersService.getOrderItems(o.id))));
  res.json({ data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
});

export const getMyOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const order = await ordersService.getOrderById(id);
  if (order.userId !== req.authUser!.id) throw AppError.forbidden();
  const items = await ordersService.getOrderItems(order.id);
  res.json({ data: toOrderDTO(order, items) });
});

export const listAdminOrders = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = listOrdersQuerySchema.parse(req.query);
  const storeIdParam = req.query.storeId ? parseInt(req.query.storeId as string, 10) : undefined;
  const storeIds = await getStoreIdsManagedByUser(req.authUser!);

  const restrictToStoreIds = storeIdParam !== undefined ? [storeIdParam] : storeIds;
  if (storeIdParam !== undefined && storeIds !== 'all' && !storeIds.includes(storeIdParam)) {
    throw AppError.forbidden('You do not manage this store');
  }

  const { rows, total } = await ordersService.listOrders({ ...query, restrictToStoreIds });
  const data = await Promise.all(rows.map(async (o) => toOrderDTO(o, await ordersService.getOrderItems(o.id))));
  res.json({ data, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
});

export const getAdminOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const order = await ordersService.getOrderById(id);
  const items = await ordersService.getOrderItems(order.id);
  res.json({ data: toOrderDTO(order, items) });
});

export const updateOrderStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const { status } = updateOrderStatusSchema.parse(req.body);
  const order = await ordersService.updateOrderStatus(id, status);
  const items = await ordersService.getOrderItems(order.id);
  res.json({ data: toOrderDTO(order, items) });
});
