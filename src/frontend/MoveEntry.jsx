window.MoveEntry = React.createClass({
	render: function () {
		return <div className="moveEntry"
			style={{
				fontWeight: this.props.isSelected ? 'bold' : 'lighter',
				flexGrow: 1,
				paddingLeft: 5,
			}}
			onClick={this.props.onClick}
		>{reprOfMove(this.props.move)}</div>
	}
});