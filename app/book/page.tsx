import { formatPrice } from "../../lib/sedifex-public";
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

export default async function BookPage({ searchParams }: BookPageProps) {
  const [params, services] = await Promise.all([
    searchParams,
    getOncoNurseServices(),
  ]);

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    priceLabel: formatPrice(service.price),
    price: service.price,
    category: service.category,
  }));

  const eventAmount = parseAmount(params.paymentAmount);
  const eventOption = params.serviceId
    ? {
        id: params.serviceId,
        name: params.serviceName || "Upcoming event",
        priceLabel: eventAmount && eventAmount > 0 ? formatPrice(eventAmount) : "Register interest",
        price: eventAmount,
        category: "Upcoming Event",
        slotId: params.slotId,
        bookingDate: params.bookingDate,
        bookingTime: params.bookingTime,
        scheduleStatus: params.scheduleStatus,
        isEvent: Boolean(params.slotId),
      }
    : null;

  const mergedOptions = eventOption
    ? [eventOption, ...serviceOptions.filter((service) => service.id !== eventOption.id)]
    : serviceOptions;

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
