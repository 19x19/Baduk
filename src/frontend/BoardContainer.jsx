window.BoardContainer = React.createClass({
    // props:
    // mostRecentGameState
    // selectedMoveIdx
    // hoverPiece
    // boardSize
    // borderSize
    // handleClick
    // gridSize
    // playerColor
    // todo: reduce these props
    getDisplayedStones: function () {
        if ((this.props.gameStatus === 'resolving_dead_groups' || this.props.gameStatus === 'game_over') && this.props.deadGroupResolutionState) {
            return {
                gameBoardSize: this.props.mostRecentGameState.size,
                stones: this.props.deadGroupResolutionState.stones,
                selectedMove: null,
            };
        } else {
            return this.getSelectedDisplayedStones();
        }
    },
    getSelectedDisplayedStones: function () {


        if (this.props.mostRecentGameState.moves.length === this.props.selectedMoveIdx + 1) {
            // fast path optimization, not strictly necessary
            var selectedStones = this.props.mostRecentGameState.stones;
        } else {
            var selectedStones = boardStateHistoryOf(this.props.mostRecentGameState)[this.props.selectedMoveIdx + 1].stones;
        }
        selectedStones = JSON.parse(JSON.stringify(selectedStones));

        var selectedMove = this.props.mostRecentGameState.moves[this.props.selectedMoveIdx];

        var gameBoardSize = this.props.mostRecentGameState.size;

        // propagate hover
        if ((this.props.gameStatus === 'playing' || this.props.gameStatus === null) &&
            this.props.hoverPiece &&
            isLegalMove(this.props.mostRecentGameState, this.props.playerColor, this.props.hoverPiece.x, this.props.hoverPiece.y)) {

            selectedStones[this.props.hoverPiece.x][this.props.hoverPiece.y] = { 'black': 3, 'white': 4 }[this.props.playerColor];
        }

        return {
            gameBoardSize: gameBoardSize,
            stones: selectedStones,
            selectedMove: selectedMove,
        };

    },
    render: function () {

        var displayedStones = this.getDisplayedStones();
        var itemizedStones = itemizedStonesOf(displayedStones.gameBoardSize, displayedStones.stones, displayedStones.selectedMove);
        var estimatedSquareOwnership = estimatedSquareOwnershipOfBoard(displayedStones.gameBoardSize, displayedStones.stones);
        var itemizedSquareOwnership = itemizedStonesOf(displayedStones.gameBoardSize, estimatedSquareOwnership);

        // this.props.boardSize is actually boardSizePixels

        return <Board
            boardSizePixels={this.props.boardSize}
            borderSize={this.props.borderSize}
            onClick={this.props.handleClick}
            gameBoardSize={this.props.mostRecentGameState.size}
            itemizedStones={itemizedStones}
            itemizedSquareOwnership={itemizedSquareOwnership} />
    }
});