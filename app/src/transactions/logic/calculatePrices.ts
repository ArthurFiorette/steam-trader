import { NextFunction } from '../../util/middleware';
import { getAllItemsPrice } from '../../steam/market';
import { AccountOptions } from '../../accounts/options';
import { ItemPrice, OfferContext } from '../types';
import { Reason } from '../processor';

export default async function middleware(
  context: OfferContext,
  next: NextFunction
) {
  const { processor, itemsToReceive, itemsToGive } = context;
  const { options } = processor.account;
  context.receiveItemsPrices = await getAllItemsPrice(
    itemsToReceive,
    processor.account.options.status.currency
  );

  if (context.receiveItemsPrices.some((item) => isTrash(item, options))) {
    processor.decline(context, Reason.TRASH);
  }

  context.receivePrice = reducePrices(context.receiveItemsPrices);

  context.giveItemsPrices = await getAllItemsPrice(
    itemsToGive,
    options.status.currency
  );
  context.givePrice = reducePrices(context.giveItemsPrices);

  context.profit = context.receivePrice - context.givePrice;

  return next();
}

export function isTrash(item: ItemPrice, { trading }: AccountOptions): boolean {
  return calculatePrice(item) <= trading.trashLimit;
}

export function calculatePrice({
  median_price,
  lowest_price
}: ItemPrice): number {
  return !median_price || lowest_price > median_price
    ? lowest_price
    : median_price + lowest_price / 2;
}

function reducePrices(items: ItemPrice[]): number {
  return items.map(calculatePrice).reduce((a, b) => a + b, 0);
}
