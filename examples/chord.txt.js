looker.plugins.visualizations.add({
    id: "chord",
    label: "Chord",
    options: {
      color_range: {
        type: "array",
        label: "Color Range",
        display: "colors",
        default: ["#dd3333", "#80ce5d", "#f78131", "#369dc1", "#c572d3", "#36c1b3", "#b57052", "#ed69af"],
      },
    },
    // Set up the initial state of the visualization
    create: function(element, config) {
      var d3 = d3v4;
  
      var css = element.innerHTML = `
        <style>
          .chordchart circle {
            fill: none;
            pointer-events: all;
          }
  
          .chordchart:hover path.chord-fade {
            display: none;
          }
  
          .groups text {
            font-size: 12px;
          }
  
          .chord-tip {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 10;
          }
        </style>
      `;
  
      this._tooltip = d3.select(element).append('div').attr('class', 'chord-tip');
  
      this._svg = d3.select(element).append("svg");
  
    },
  
    computeMatrix: function(data, dimensions, measure) {
      var indexByName = d3.map();
      var nameByIndex = d3.map();
      var matrix = [];
      var n = 0;
  
      // Compute a unique index for each package name.
      dimensions.forEach(function(dimension) {
        data.forEach(function(d) {
          if (!indexByName.has(d = d[dimension].value )) {
            nameByIndex.set(n, d);
            indexByName.set(d, n++);
          }
        });
      });
  
      // Construct a square matrix
      for (var i = -1; ++i < n;) {
        matrix[i] = [];
        for (var t = -1; ++t < n;) {
          matrix[i][t] = 0;
        }
      }
  
      // Fill matrix
      data.forEach(function(d) {
        var row = indexByName.get(d[dimensions[1]].value);
        var col = indexByName.get(d[dimensions[0]].value);
        var val = d[measure].value;
        matrix[row][col] = val;
      });
  
      return {
        matrix: matrix,
        indexByName: indexByName,
        nameByIndex: nameByIndex
      };
    },
  
    // Render in response to the data or settings changing
    update: function(data, element, config, queryResponse) {
      if (!handleErrors(this, queryResponse, {
        min_pivots: 0, max_pivots: 0,
        min_dimensions: 2, max_dimensions: 2,
        min_measures: 1, max_measures: 1,
      })) return;
      var d3 = d3v4;
      var _self = this;
  
      var dimensions = queryResponse.fields.dimension_like;
      var measure = queryResponse.fields.measure_like[0];
  
      // Set dimensions
      var width = element.clientWidth;
      var height = element.clientHeight;
      var margin = 10;
      var thickness = 15;
      var outerRadius = Math.min(width, height) * 0.5;
      var innerRadius = outerRadius - thickness;
  
      // Stop if radius is < 0
      // TODO: show warning to user ???
      // TODO: Set a min-radius ???
      if (innerRadius < 0) return;
  
      var valueFormatter = formatType(measure.value_format);
  
      var tooltip = this._tooltip;
  
      // Set color scale
      var color = d3.scaleOrdinal()
        .range(config.color_range);
  
      // Set chord layout
      var chord = d3.chord()
        .padAngle(0.025)
        .sortSubgroups(d3.descending)
        .sortChords(d3.descending);
  
      // Create ribbon generator
      var ribbon = d3.ribbon()
        .radius(innerRadius);
  
      // Create arc generator
      var arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);
  
      // Turn data into matrix
      var matrix = this.computeMatrix(data, dimensions.map(function(d) {return d.name}), measure.name);
  
      // draw
      var svg = this._svg
        .html('')
        .attr('width', '100%')
        .attr('height', '100%')
        .append('g')
        .attr('class', 'chordchart')
        .attr('transform', 'translate(' + width / 2 + ',' + (height / 2) + ')')
        .datum(chord(matrix.matrix));
  
      svg.append('circle')
        .attr('r', outerRadius);
  
      var group = svg.append('g')
        .attr('class', 'groups')
        .selectAll('g')
        .data(function(chords) { return chords.groups; })
        .enter().append('g')
        .on('mouseover', mouseover);
  
      var groupPath = group.append('path')
        .style('opacity', 0.8)
        .style('fill', function(d) { return color(d.index); })
        .style('stroke', function(d) { return d3.rgb(color(d.index)).darker(); })
        .attr("id", function(d, i) { return "group" + i; })
        .attr('d', arc);
  
      var groupPathNodes = groupPath.nodes();
  
      var groupText = group.append('text').attr('dy', 11);
  
      groupText.append('textPath')
        .attr('xlink:href', function(d, i) { return '#group' + i; })
        .attr("startOffset",function(d,i) { return (groupPathNodes[i].getTotalLength() - (thickness * 2)) / 4 })
        .style("text-anchor","middle")
        .text(function(d) { return matrix.nameByIndex.get(d.index); });
  
  
      // Remove the labels that don't fit. :(
      groupText
        .filter(function(d, i) {
          return groupPathNodes[i].getTotalLength() / 2 - 16 < this.getComputedTextLength();
        })
        .remove();
  
      var ribbons = svg.append('g')
        .attr('class', 'ribbons')
        .selectAll('path')
        .data(function(chords) { return chords; })
        .enter().append('path')
        .style('opacity', 0.8)
        .attr('d', ribbon)
        .style('fill', function(d) { return color(d.target.index); })
        .style('stroke', function(d) { return d3.rgb(color(d.target.index)).darker(); })
        .on('mouseenter', function(d) {
          tooltip.html(_self.titleText(matrix.nameByIndex, d.source, d.target, valueFormatter))
        })
        .on('mouseleave', function(d) {
          tooltip.html('');
        });
  
      function mouseover(d, i) {
        ribbons.classed('chord-fade', function(p) {
          return p.source.index != i &&
            p.target.index != i;
        });
      }
  
    },
  
    titleText: function(lookup, source, target, formatter) {
      var sourceName = lookup.get(source.index);
      var sourceValue = formatter(source.value);
      var targetName = lookup.get(target.index);
      var targetValue = formatter(target.value);
  
      var output = '<p>' + sourceName + ' → ' + targetName + ': ' + sourceValue + '</p>';
      output += '<p>' + targetName + ' → ' + sourceName + ': ' + targetValue + '</p>';
  
      return output;
      /*
      return lookup.get(source.index)
      + " → " + lookup.get(target.index)
      + ": " + formatter(source.value)
      + "\n" + lookup.get(target.index)
      + " → " + lookup.get(source.index)
      + ": " + formatter(target.value);
      */
    }
  
  });
  
  