import type { Response } from 'express';
import type { AuthedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toProductDTO } from '../utils/mappers.js';
import { listProductsQuerySchema, createProductSchema, updateProductSchema } from '../validators/products.validator.js';
import { idParamSchema } from '../validators/common.js';
import * as productsService from '../services/products.service.js';
import { getStoreIdsManagedByUser, userCanManageStore } from '../services/storeAccess.service.js';
import { AppError } from '../utils/errors.js';

export const listPublicProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const query = listProductsQuerySchema.parse(req.query);
  const { rows, total } = await productsService.listProducts({ ...query, includeInactive: false });
  res.json({
    data: rows.map(toProductDTO),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 },
  });
});

export const getPublicProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const product = await productsService.getProductById(id);
  if (!product.isActive) throw AppError.notFound('Product not found');
  res.json({ data: toProductDTO(product) });
});

export const listMyProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const user = req.authUser!;
  const query = listProductsQuerySchema.parse(req.query);

  if (query.storeId) {
    const allowed = await userCanManageStore(user, query.storeId);
    if (!allowed) throw AppError.forbidden('You do not manage this store');
    const { rows, total } = await productsService.listProducts({ ...query, includeInactive: true });
    res.json({ data: rows.map(toProductDTO), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
    return;
  }

  const storeIds = await getStoreIdsManagedByUser(user);
  const { rows, total } = await productsService.listProducts({ ...query, includeInactive: true, restrictToStoreIds: storeIds });
  res.json({ data: rows.map(toProductDTO), pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) || 1 } });
});

export const createProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const storeId = parseInt(req.body.storeId, 10);
  if (Number.isNaN(storeId)) throw AppError.badRequest('storeId is required');
  const allowed = await userCanManageStore(req.authUser!, storeId);
  if (!allowed) throw AppError.forbidden('You do not manage this store');

  const body = createProductSchema.parse(req.body);
  const product = await productsService.createProduct({
    ...body,
    storeId,
    price: String(body.price),
  });
  res.status(201).json({ data: toProductDTO(product) });
});

export const updateProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const body = updateProductSchema.parse(req.body);
  const product = await productsService.updateProduct(id, {
    ...body,
    price: body.price !== undefined ? String(body.price) : undefined,
  });
  res.json({ data: toProductDTO(product) });
});

export const deleteProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  await productsService.deleteProduct(id);
  res.status(204).send();
});
