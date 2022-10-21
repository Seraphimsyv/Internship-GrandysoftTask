import * as React from 'react';

class DrawBoard extends React.Component {
  constructor(props) {
    super(props);
    this.handleLeftClick = this.handleLeftClick.bind(this);
    this.handleRightClick = this.handleRightClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleCollapseClick = this.handleCollapseClick.bind(this);
    this.state = {
      contextId: 'DrawBoardDiv',
      isDraw: false,
      lines: [],
      dots: {},
      lastPoints: {},
      lastDots: {}
    };
  }

  handleLeftClick(evt) {
    if (this.state.isDraw !== true) {
      this.setState({
        isDraw: true,
        lastPoints: {
          start: {
            x: evt.nativeEvent.x,
            y: evt.nativeEvent.y
          },
          end: {
            x: evt.nativeEvent.x,
            y: evt.nativeEvent.y
          }
        }
      })
    } else {
      let point = Object.assign(
        { center: this.getCenter(this.state.lastPoints.start, this.state.lastPoints.end) },
        this.state.lastPoints
      );  
      let lines = [point].concat(this.state.lines);
      this.setState({
        isDraw: false,
        lines: lines,
        dots: Object.assign(this.state.dots, this.state.lastDots),
        lastPoints: {},
        lastDots: {}
      })
    }
  }

  handleRightClick(evt) {
    evt.preventDefault();
    if (this.state.isDraw === true) {

      const ctx = window.document.getElementById(this.state.contextId).getContext('2d');
      
      this.clearCanvas()

      for(let l = 0; l < this.state.lines.length; l++) {
        this.drawLine(ctx, this.state.lines[l].start, this.state.lines[l].end);
      }

      for(const dot in this.state.dots) {
        this.drawIntersect(ctx, this.state.dots[dot].x, this.state.dots[dot].y);
      }

      this.setState({
        isDraw: false,
        lastDots: {}
      })
    }
  }

  handleMouseMove(evt) {
    if (this.state.isDraw === true) {
      let lastDots = {};
      let lastPoint = Object.assign({}, this.state.lastPoints);
      lastPoint.end = {
        x: evt.nativeEvent.x,
        y: evt.nativeEvent.y
      };

      const ctx = window.document.getElementById(this.state.contextId).getContext('2d');

      this.clearCanvas()
      
      this.drawLine(ctx, lastPoint.start, lastPoint.end);

      for(let l = 0; l < this.state.lines.length; l++) {
        this.drawLine(ctx, this.state.lines[l].start, this.state.lines[l].end);

        let dot = this.checkIntersect(this.state.lines[l].start, this.state.lines[l].end, lastPoint.start, lastPoint.end);
        if (dot !== undefined) {
          this.drawIntersect(ctx, dot.x, dot.y);
          lastDots[`${l}-${this.state.lines.length}`] = dot;
        } else {
          delete lastDots[`${l}-${this.state.lines.length}`];
        }
      }

      for(const dot in this.state.dots) {
        this.drawIntersect(ctx, this.state.dots[dot].x, this.state.dots[dot].y);
      }

      this.setState({
        lastPoints: lastPoint,
        lastDots: Object.assign(this.state.lastDots, lastDots)
      });
    }
  }

  collapseLines() {
    const ctx = window.document.getElementById(this.state.contextId).getContext('2d');
    
    this.clearCanvas()

    let lines = [].concat(this.state.lines);

    for(let l = 0; l < lines.length; l++) {
      
      let new_start = null;
      let new_end = null;

      for(let p = 0; p < 5; p++) {
        if (new_start === null && new_end === null) {
          new_start = this.getCenter(lines[l].start, lines[l].center)
          new_end = this.getCenter(lines[l].end, lines[l].center)
        } else {
          new_start = this.getCenter(lines[l].start, new_start)
          new_end = this.getCenter(lines[l].end, new_end)
        }
      }

      lines[l].start = new_start;
      lines[l].end = new_end;

      this.setState({ lines: lines });

      this.drawLine(ctx, new_start, new_end);
    }

  }

  handleCollapseClick() {
    let count = 0;
    this.intervalCollapse = setInterval(() => this.collapseLines(), 15);
    this.intervalTimer = setInterval(
      () => {
        if (count === 3) {
          this.clearCanvas()
          clearInterval(this.intervalCollapse);
          clearInterval(this.intervalTimer);
          this.setState({
            lines: [],
            dots: {},
            lastPoints: {},
            lastDots: {}
          })
        } else {
          count += 1;
        }
      }, 1000
    )
  }

  drawLine(ctx, start, end) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  drawIntersect(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = 'red'
    ctx.strokeStyle = "black";
    ctx.stroke();
  }

  getCenter(start, end) {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    }
  }

  checkIntersect(from1, to1, from2, to2) {
    const dX = to1.x - from1.x;
    const dY = to1.y - from1.y;
  
    const determinant =  dX * (to2.y - from2.y) - (to2.x - from2.x) * dY;
    if (determinant === 0) return false;
  
    const lambda = ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
    const gamma = ((from1.y - to1.y) * (to2.x - from1.x) + dX * (to2.y - from1.y)) / determinant;
  
    if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return undefined;
  
    return {
      x: from1.x + lambda * dX,
      y: from1.y + lambda * dY,
    };
  }

  clearCanvas() {
    const elem = window.document.getElementById(this.state.contextId);
    const ctx = elem.getContext('2d');
    ctx.clearRect(0, 0, elem.width, elem.height);
  }

  render() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start'
        }}
      >
        <div>
          <canvas
            style={{
              border: '1px solid red',
            }}
            width='600'
            height='600'
            id="DrawBoardDiv"
            onClick={this.handleLeftClick}
            onContextMenu={this.handleRightClick}
            onMouseMove={this.handleMouseMove}
          />
        </div>
        <button
          style={{
            padding: '1em',
            border: '1px solid red',
            color: 'red',
            width: 'fit-content',
            background: 'transparent'
          }}
          onClick={this.handleCollapseClick}
        >
          Collapse lines
        </button>
      </div>
    )
  }
}

export default DrawBoard;