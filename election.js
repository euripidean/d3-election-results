const COLORS = {
  Conservative: "#0087DC",
  Labour: "#DC241f",
  "Liberal Democrat": "#FAA61A",
  "Scottish National Party": "#FFFF00",
  Green: "#6AB023",
  "Plaid Cymru": "#3F8428",
  "Reform UK": "#12B6CF",
  "Democratic Unionist Party": "#D46A4C",
  "Sinn Fein": "#326760",
  "Social Democratic & Labour Party": "#99FF66",
  "Ultra Unionist Party": "#9999FF",
  Independent: "#808080",
  "Alliance Party": "#F6CB2F",
  "Traditional Unionist Voice": "#FF0000",
  "Ulster Unionist Party ": "#9999FF",
  Other: "#FF69B4",
};

function clearPanel() {
  const panel = d3.select("#slide-out-panel");
  panel.selectAll("*").remove();
}

function populatePanel(d, placementHeaders) {
  const panel = d3.select("#slide-out-panel");
  panel.append("div").attr("class", "panel-content");
  panel.append("h2").text(d["name"]);

  const results = {};

  // If the constituency had x number of parties, this should make sure we get them all.
  placementHeaders.forEach((header) => {
    const party = d[header];
    const votes = d[header.replace("party", "votes")];
    results[party] = parseInt(votes);
  });

  // Remove any results that are NaN
  Object.keys(results).forEach((key) => {
    if (isNaN(results[key])) {
      delete results[key];
    }
  });

  const pieData = Object.entries(results).map(([key, value]) => ({
    party: key,
    value: value,
  }));

  console.log(pieData);

  const pieGen = d3.pie();
  const arcData = pieGen(pieData.map((d) => d.value));

  const svgWidth = 400;
  const svgHeight = 400;
  const radius = Math.min(svgWidth, svgHeight) / 2;

  const arcGen = d3.arc().innerRadius(0).outerRadius(radius);

  console.log(pieData);

  const svg = panel
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .style("padding", "10px");
  const key = panel.append("div");

  const arcLabels = d3.arc().innerRadius(150).outerRadius(150);

  const pieGroup = svg
    .append("g")
    .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);

  const piePath = pieGroup
    .selectAll("path")
    .data(arcData)
    .enter()
    .append("path")
    .attr("d", arcGen)
    .attr("fill", (d, i) => COLORS[pieData[i].party] || COLORS["other"]);
}

function handleClick(d, placementHeaders) {
  clearPanel();
  populatePanel(d, placementHeaders);

  d3.select("#slide-out-panel").classed("active", true);
}

async function handleData() {
  const data = await d3.csv("election.csv");
  // SORT DATA BY NAME
  data.sort((a, b) => {
    if (a["name"] < b["name"]) {
      return -1;
    } else if (a["name"] > b["name"]) {
      return 1;
    } else {
      return 0;
    }
  });
  const headers = Object.keys(data[0]);
  const placementHeaders = headers.filter((header) =>
    header.includes("_place_party")
  );

  const parties = [];
  data.forEach((d) => {
    if (!parties.includes(d["1st_place_party"])) {
      parties.push(d["1st_place_party"]);
    }
  });

  const svg = d3.select("svg");

  const width = 600;
  const height = 600;

  // There are 650 constituencies in the UK
  const numRows = 25;
  const numCols = 26;

  // Calculate the size of each square based on SVG dimensions
  const squareWidth = width / numCols;
  const squareHeight = height / numRows;

  const g = svg.append("g");

  const squares = g
    .selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("x", (d, i) => (i % numCols) * squareWidth)
    .attr("y", (d, i) => Math.floor(i / numCols) * squareHeight)
    .attr("width", squareWidth)
    .attr("height", squareHeight)
    .attr("fill", (d) => COLORS[d["1st_place_party"]])
    .attr("stroke", "black");

  squares.on("click", (event, d) => {
    event.stopPropagation();
    handleClick(d, placementHeaders);
  });

  // Hide the modal when clicking anywhere outside of it
  d3.select("body").on("click", (event) => {
    const panel = document.getElementById("slide-out-panel");
    if (!panel.contains(event.target)) {
      d3.select("#slide-out-panel").classed("active", false);
    }
  });

  // Legend on the right hand side of the page with all parties and colors listed
  const legend = d3.select("#legend");
  const legendItems = legend
    .selectAll("div")
    .data(parties)
    .enter()
    .append("div");
  legendItems.style("background-color", (d) => COLORS[d]);
  legendItems.style("width", "150px");
  legendItems.style("margin", "5px");
  legendItems.style("padding", "2px");
  legendItems.style("border", "1px solid black");
  legendItems.text((d) => d);
}

handleData();
