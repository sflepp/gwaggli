import {TextPlain} from "./text-plain";

const fs = require("fs")
it('should extract plain text', async () => {
    const data = fs.readFileSync("./__test-data__/data-loader/txt/rfc1149.txt")

    const sut = new TextPlain();
    const result = await sut.parse(data);

    expect(result).toContain("Avian Carriers")
    expect(result.length).toBeGreaterThan(1000);
})