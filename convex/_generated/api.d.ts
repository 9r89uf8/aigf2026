/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _utils_auth from "../_utils/auth.js";
import type * as auth from "../auth.js";
import type * as cdn from "../cdn.js";
import type * as chat from "../chat.js";
import type * as chat_actions from "../chat_actions.js";
import type * as girls from "../girls.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as payments_actions from "../payments_actions.js";
import type * as profile from "../profile.js";
import type * as s3 from "../s3.js";
import type * as turnstile from "../turnstile.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "_utils/auth": typeof _utils_auth;
  auth: typeof auth;
  cdn: typeof cdn;
  chat: typeof chat;
  chat_actions: typeof chat_actions;
  girls: typeof girls;
  http: typeof http;
  payments: typeof payments;
  payments_actions: typeof payments_actions;
  profile: typeof profile;
  s3: typeof s3;
  turnstile: typeof turnstile;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
