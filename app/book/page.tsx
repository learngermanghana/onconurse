import { formatPrice, getServiceData } from "../../lib/sedifex";
import BookingForm from "./BookingForm";

type BookPageProps = {
  searchParams: Promise<{
    serviceId?: string;
    serviceName?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const [params, services] = await Promise.all([
    searchParams,
    getServiceData(),
  ]);

  const serviceOptions = services.map((service) => ({
    id: service.id,
    name: service.name,
    priceLabel: formatPrice(service.price),
    price: service.price,
    category: service.category,
  }));

  return (
    <BookingForm
      initialServiceId={params.serviceId}
      initialServiceName={params.serviceName}
      serviceOptions={serviceOptions}
    />
  );
}
