import { onRequestOptions as __api_cancel_subscription_ts_onRequestOptions } from "D:\\yodha mode\\functions\\api\\cancel-subscription.ts"
import { onRequestPost as __api_cancel_subscription_ts_onRequestPost } from "D:\\yodha mode\\functions\\api\\cancel-subscription.ts"
import { onRequestOptions as __api_create_subscription_ts_onRequestOptions } from "D:\\yodha mode\\functions\\api\\create-subscription.ts"
import { onRequestPost as __api_create_subscription_ts_onRequestPost } from "D:\\yodha mode\\functions\\api\\create-subscription.ts"
import { onRequestOptions as __api_verify_subscription_ts_onRequestOptions } from "D:\\yodha mode\\functions\\api\\verify-subscription.ts"
import { onRequestPost as __api_verify_subscription_ts_onRequestPost } from "D:\\yodha mode\\functions\\api\\verify-subscription.ts"

export const routes = [
    {
      routePath: "/api/cancel-subscription",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_cancel_subscription_ts_onRequestOptions],
    },
  {
      routePath: "/api/cancel-subscription",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_cancel_subscription_ts_onRequestPost],
    },
  {
      routePath: "/api/create-subscription",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_create_subscription_ts_onRequestOptions],
    },
  {
      routePath: "/api/create-subscription",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_create_subscription_ts_onRequestPost],
    },
  {
      routePath: "/api/verify-subscription",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_verify_subscription_ts_onRequestOptions],
    },
  {
      routePath: "/api/verify-subscription",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_verify_subscription_ts_onRequestPost],
    },
  ]