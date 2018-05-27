const { listRegions } = require("../lib/aws-region-list");

describe("region list", () => {
    it("Prefixes European regions with 'Europe - '", () => expect(listRegions()[1].name).toEqual("Europe - Ireland (eu-west-1)"));

    it("Prefixes American regions with 'America - '", () => expect(listRegions()[5].name).toEqual("America - Ohio (us-east-2)"));

    it("Replaces 'n-' with North", () => expect(listRegions()[4].name).toEqual("America - North Virginia (us-east-1)"));
});
