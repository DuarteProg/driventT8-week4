import { ApplicationError } from "@/protocols";

export function forbiddenError(): ApplicationError {
  return {
    name: "paymentRequiredError",
    message: "You haven't permission",
  };
}