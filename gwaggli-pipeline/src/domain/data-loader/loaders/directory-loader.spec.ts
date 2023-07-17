import { DirectoryLoader } from './directory-loader';
it('should load a full directory', async () => {
    const sut = new DirectoryLoader();

    const results = await sut.load({
        locationType: 'fs/directory',
        location: './test-data/data-loader',
    });

    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.find((it) => it.location === 'txt/rfc1149.txt')).not.toBeNull();
    expect(results.find((it) => it.location === 'txt/rfc2549.txt')).not.toBeNull();
    expect(results.find((it) => it.location === 'pdf/git.pdf')).not.toBeNull();
});
