import Hello from "../hello"

describe("Test the Hello app", () => {
  let stdout: string[]

  beforeEach(() => {
    stdout = []
    jest
      .spyOn(process.stdout, "write")
      .mockImplementation(val => stdout.push(val))
  })

  afterEach(() => jest.restoreAllMocks())

  it("should print Hello", async () => {
    await Hello.run([])
    expect(stdout[0]).toContain("hello world")
  })
})
