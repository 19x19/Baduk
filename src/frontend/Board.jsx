window.Board = React.createClass({
    posOf: function (row, col) {
        var stoneSize = this.gridSize() / (this.props.gameBoardSize - 1);
        return {
            x: this.props.borderSize + (row * stoneSize),
            y: this.props.borderSize + (col * stoneSize),
        };
    },
    gridSize: function () {
        return this.props.boardSizePixels - 2*this.props.borderSize;
    },
    render: function () {
        return <svg
            height={this.props.boardSizePixels}
            width={this.props.boardSizePixels}
            onClick={this.props.onClick}
        >
            <image xlinkHref="/img/wood-texture.jpg" preserveAspectRatio="none" x="0" y="0" width={this.props.boardSizePixels} height={this.props.boardSizePixels} />
            <image xlinkHref={{
                9: "/img/go_board_9.png",
                13: "/img/go_board_13.png",
                19: "/img/go_board_19.png",
            }[this.props.gameBoardSize] }
                width={this.gridSize()}
                height={this.gridSize()}
                x={this.props.borderSize}
                y={this.props.borderSize} />
            {this.props.itemizedStones.map((stone, i) => {
                var posOfStone = this.posOf(stone.x, stone.y);
                var stoneSize = this.gridSize() / this.props.gameBoardSize;
                if (stone.color === 'white' || stone.color === 'black') {
                    return <image
                        key={stone.color + "-" + stone.x + "-" + stone.y}
                        xlinkHref={"/img/" + stone.color + "_circle" + (stone.isSelectedMove ? "_recent" : "" ) + ".png"}
                        x={posOfStone.x - (stoneSize / 2)}
                        y={posOfStone.y - (stoneSize / 2)}
                        width={stoneSize}
                        height={stoneSize}
                        opacity={stone.isGhost ? 0.5 : 1} />
                }
            })}
            {this.props.itemizedSquareOwnership.map((stone, i) => {
                var posOfStone = this.posOf(stone.x, stone.y);
                var stoneSize = 15
                if (stone.color === 'white' || stone.color === 'black') {
                    return <image
                        key={stone.color + "-" + stone.x + "-" + stone.y}
                        xlinkHref={"/img/" + stone.color + "_circle" + (stone.isSelectedMove ? "_recent" : "" ) + ".png"}
                        x={posOfStone.x - (stoneSize / 2)}
                        y={posOfStone.y - (stoneSize / 2)}
                        width={stoneSize}
                        height={stoneSize}
                        opacity={stone.isGhost ? 0.5 : 1} />
                }
            })}
        </svg>
    }
});