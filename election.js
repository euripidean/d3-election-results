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
  "Speaker of the House of Commons": "#000000",
  Other: "#FF69B4",
};

function clearPanel() {
  const panel = d3.select("#slide-out-panel");
  panel.selectAll("*").remove();
}

function populatePanel(d, placementHeaders) {
  const totalVotes = parseInt(d["total_votes"]);
  const panel = d3.select("#slide-out-panel");
  panel.append("div").attr("class", "panel-content");
  panel.append("h2").text(d["name"]);
  const container = panel
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-around");
  container
    .append("p")
    .text(`TURNOUT: ${d["turnout"]}%`)
    .style("text-align", "center");
  container.append("p").text(`TOTAL VOTES: ${totalVotes.toLocaleString()}`);

  const results = {};

  // If the constituency had x number of parties, this should make sure we get them all.
  placementHeaders.forEach((header) => {
    let party = d[header];
    const votes = d[header.replace("party", "votes")];
    if (results.hasOwnProperty(party)) {
      let i = 2;
      while (results.hasOwnProperty(party + i)) {
        i++;
      }
      party = party + i; // This is necessary as there can be more than one Independent candidate
    }
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

  const pieGen = d3.pie();
  const arcData = pieGen(pieData.map((d) => d.value));

  const svgWidth = 375;
  const svgHeight = 375;
  const radius = Math.min(svgWidth, svgHeight) / 2 - 15;

  const arcGen = d3.arc().innerRadius(0).outerRadius(radius);

  const svg = panel
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  const key = panel.append("div");

  const pieGroup = svg
    .append("g")
    .attr("transform", `translate(${svgWidth / 2}, ${svgHeight / 2})`);
  pieGroup
    .selectAll("path")
    .data(arcData)
    .enter()
    .append("path")
    .attr("d", arcGen)
    .attr("fill", (d, i) => COLORS[pieData[i].party] || COLORS["Other"]);

  const legend = key
    .selectAll("div")
    .data(pieData)
    .enter()
    .append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin", "5px");
  legend
    .append("div")
    .style("width", "20px")
    .style("height", "20px")
    .style("background-color", (d) => COLORS[d.party] || COLORS["Other"]);
  legend
    .append("span")
    .text((d) => d.party)
    .style("margin", "5px");
  legend
    .append("span")
    .text((d) => d.value.toLocaleString())
    .style("margin", "5px");
  legend
    .append("span")
    .text(
      (d) =>
        Math.round((d.value / d3.sum(pieData.map((d) => d.value))) * 100) + "%"
    )
    .style("font-weight", "bold");
}

function handleClick(d, placementHeaders) {
  clearPanel();
  populatePanel(d, placementHeaders);

  d3.select("#slide-out-panel").classed("active", true);
}

async function handleData() {
  const data = await d3.csv("election.csv");
  // SORT DATA BY NAME - makes finding places for debugging a lot easier!
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

  // sort parties alphabetically
  parties.sort();

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
    .attr("stroke", "black")
    .on("mouseover", (event, d) => {
      // Add a tooltip with name of constituency
      const tooltip = d3.select("#tooltip");
      // should hover just above the square
      tooltip.style("top", event.clientY - 50 + "px");
      tooltip.style("left", event.clientX + "px");
      tooltip.style("display", "block");
      tooltip.style("background-color", "white");
      tooltip.style("border", "1px solid black");
      tooltip.style("padding", "5px");
      tooltip.text(d["name"]);
    })
    .on("mouseout", () => {
      const tooltip = d3.select("#tooltip");
      tooltip.style("display", "none");
    });

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
  const legend = d3
    .select("#legend")
    .style("box-shadow", "0 0 5px 0 rgba(0, 0, 0, 0.2)");
  const legendItems = legend
    .selectAll("div")
    .data(parties)
    .enter()
    .append("div")
    .style("margin", "5px")
    .style("padding", "2px")
    .style("display", "flex");

  const keys = legendItems.append("svg").attr("width", 20).attr("height", 20);
  keys
    .append("circle")
    .attr("cx", 10)
    .attr("cy", 10)
    .attr("r", 8)
    .style("fill", (d) => COLORS[d])
    .style("stroke", "black");

  legendItems
    .append("text")
    .style("padding-left", "24px")
    .style("font-size", "14px")
    .text((d) => d);
}

handleData();
