export function toDomain<T>(value: unknown): T {
  if (!value || typeof value !== "object") {
    throw new Error("MongoDB returned an invalid document");
  }

  const {
    _id: _ignoredId,
    __v: _ignoredVersion,
    ...domainValue
  } = value as Record<string, unknown>;
  return domainValue as T;
}
