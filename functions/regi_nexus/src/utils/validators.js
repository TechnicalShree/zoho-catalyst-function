export function isPlainObject(value) {
	return value && typeof value === 'object' && !Array.isArray(value);
}

export function isSafeIdentifier(value) {
	return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
