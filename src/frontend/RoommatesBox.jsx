window.RoommatesBox = React.createClass({
    render: function () {
        return <div className="well">
            <h5>Roommates</h5>
            <div id="roommates">{this.props.roommates.map(function (roommate) {
                return <pre key={roommate.name}><i
                    className={"fa fa-" + faClassNameOf(roommate.color)}
                    style={{ marginRight: 7 }} />{roommate.name}</pre>
            })}</div>
        </div>
    }
});
