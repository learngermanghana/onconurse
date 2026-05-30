import { getSedifexServices } from "../../lib/sedifex";
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
    getSedifexServices(),
  ]);

  return (
    <BookingForm
      initialServiceId={params.serviceId}
      initialServiceName={params.serviceName}
      services={services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
      }))}
    />
  );
}
