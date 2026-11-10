// mirrors src/common/enum in the backend; the API speaks in these numbers

export const LanguageEnum = { AR: 0, EN: 1 };
export const GenderEnum = { MALE: 0, FEMALE: 1 };
export const RoleEnum = { USER: 0, ADMIN: 1 };
export const ProviderEnum = { SYSTEM: 0, GOOGLE: 1 };
export const AccountStatusEnum = { ARCHIVE: 0, ACTIVE: 1 };
export const UsersByAccountStatusEnum = { ARCHIVE: 0, ACTIVE: 1, ALL: 2 };
export const MessageTypeEnum = { RECEIVER: 0, SENDER: 1, ALL: 2 };
export const LogoutEnum = { DEVICE: 0, ALL: 1 };
export const ActionInRequestEnum = { REJECTED: 1, ACCEPTED: 2 };
export const RequestStatusEnum = { PENDING: 0, ...ActionInRequestEnum };
export const RequestsTypeEnum = { ALL: 3, ...RequestStatusEnum };
