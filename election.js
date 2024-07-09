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
};

function showPanel() {
  const panel = d3.select("#slide-out-panel");
  panel.classed("active", true);
}

function populatePanel(d, placementHeaders) {}

async function handleData() {
  const data = await d3.csv("election.csv");
  const headers = Object.keys(data[0]);
  const placementHeaders = headers.filter((header) =>
    header.includes("_place_party")
  );
  placementHeaders.shift();

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

  squares
    .on("mouseover", (event, d) => {
      showPanel();
    })
    .on("click", (event, d) => {
      event.stopPropagation();
      showPanel();
    });

  // Hide the modal when clicking anywhere outside of it
  d3.select("body").on("click", () => {
    d3.select("#slide-out-panel").classed("active", false);
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
