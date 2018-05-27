const awsRegions = require("aws-regions");

const regionPrefixArea = {
    eu: "Europe",
    us: "America",
    ap: "Asia/Pacific",
    ca: "Canada",
    sa: "South America",
};

const regionPrefixOrder = {
    eu: "a",
    us: "b",
    ap: "c",
    ca: "d",
    sa: "e",
};

const formatName = name => name.split("-").map((currentSegment) => {
    if (currentSegment === "n") {
        return "North";
    }

    return `${currentSegment[0].toUpperCase()}${currentSegment.substring(1)}`;
}).join(" ");

const listRegions = () => awsRegions.list({ public: true })
    .map((region) => {
        const [areaCode] = region.code.split("-");
        const { name } = region;

        return {
            code: region.code,
            name,
            area: regionPrefixArea[areaCode],
            order: regionPrefixOrder[areaCode],
        };
    })
    .sort((a, b) => (`${a.order}${a.code}` > `${b.order}${b.code}` ? 1 : -1))
    .map(region => ({
        name: `${region.area} - ${formatName(region.name)} (${region.code})`,
        code: region.code,
    }));

module.exports = {
    listRegions,
};
