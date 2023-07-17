import {ApplicationPdf} from "./application-pdf";

import fs from "fs";

it('should extract pdf text', async () => {
    const data = fs.readFileSync("./__test-data__/data-loader/pdf/git.pdf")

    const sut = new ApplicationPdf();
    const result = await sut.parse(data);

    expect(result).toContain("Linus Torvalds");
    expect(result.length).toBeGreaterThan(1000);
});