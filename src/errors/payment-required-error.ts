import { ApplicationError } from "@/protocols";

export function paymentRequiredError(): ApplicationError {
  return {
    name: "PaymentRequiredError",
    message: "You don't paid yet",
  };
}
