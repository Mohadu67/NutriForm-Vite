describe('Jest Configuration', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });
});
