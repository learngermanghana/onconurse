import { formatPrice } from "../../lib/sedifex-public";
import { getOncoNurseEvents } from "../../lib/onconurse-events";
import { getOncoNurseServices } from "../../lib/onconurse-services";
import BookingForm from "./BookingForm";

type BookPageProps = {
  searchParams: Promise<{
    serviceId?: string;
    serviceName?: string;
    slotId?: string;
    bookingDate?: string;
    bookingTime?: string;
    scheduleStatus?: string;
    paymentAmount?: string;
  }>;
};

function parseAmount(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionKey(option: { id: string; slotId?: string }) {
  return `${option.id}-${option.slotId || "service"}`.toLowerCase();
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const [params, services, events] = await Promise.all([
    searchParams,
    getOncoNurseServices(),
    getOncoNurseEvents(),
  ]);

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    priceLabel: formatPrice(service.price),
    price: service.price,
    category: service.category,
  }));

  const eventOptions = events.map((event) => {
    const amount = event.paymentAmount || event.price;

    return {
      id: event.serviceId || `manual:${event.id}`,
      name: event.serviceName || event.title,
      priceLabel: amount && amount > 0 ? formatPrice(amount) : undefined,
      price: amount,
      category: event.category || "Upcoming Event",
      slotId: event.slotId || event.id,
      bookingDate: event.startDate || event.displayDateText || "Date to be announced",
      bookingTime: event.startTime || event.displayTimeText || "Time to be announced",
      scheduleStatus: event.scheduleStatus,
      isEvent: true,
    };
  });

  const eventAmount = parseAmount(params.paymentAmount);
  const selectedEventOption = params.serviceId
    ? {
        id: params.serviceId,
        name: params.serviceName || "Upcoming event",
        priceLabel: eventAmount && eventAmount > 0 ? formatPrice(eventAmount) : undefined,
        price: eventAmount,
        category: "Upcoming Event",
        slotId: params.slotId,
        bookingDate: params.bookingDate,
        bookingTime: params.bookingTime,
        scheduleStatus: params.scheduleStatus,
        isEvent: Boolean(params.slotId),
      }
    : null;

  const seen = new Set<string>();
  const mergedOptions = [
    ...serviceOptions,
    ...(selectedEventOption ? [selectedEventOption] : []),
    ...eventOptions,
  ].filter((option) => {
    const key = optionKey(option);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <BookingForm
      initialServiceId={params.serviceId}
      initialServiceName={params.serviceName}
      initialSlotId={params.slotId}
      initialBookingDate={params.bookingDate}
      initialBookingTime={params.bookingTime}
      initialScheduleStatus={params.scheduleStatus}
      serviceOptions={mergedOptions}
    />
  );
}
