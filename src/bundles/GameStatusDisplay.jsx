var resultStringOf = function (color, advantage) {
    if (advantage === 'resign') {
        return color[0].toUpperCase() + '+R';
    } else {
        return color[0].toUpperCase() + '+' + advantage.toString();
    }
}

window.GameStatusDisplay = React.createClass({
    render: function () {
        if (this.props.gameState.result) {
            return <div>{resultStringOf(this.props.gameState.result.winner, this.props.gameState.result.advantage)}</div>
        } else if (this.props.gameState.turn === 'white') {
            return <div>White to play</div>
        } else {
            return <div>Black to play</div>
        }
    }
});
