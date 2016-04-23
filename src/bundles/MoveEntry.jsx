window.MoveEntry = React.createClass({
	render: function () {
		return <span
			style={{
				fontWeight: this.props.isSelected ? 'bold' : 'lighter'
			}}
		>{reprOfMove(this.props.move)}</span>
	}
});