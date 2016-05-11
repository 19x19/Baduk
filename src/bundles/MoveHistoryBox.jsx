window.MoveHistoryBox = React.createClass({
    componentDidUpdate: function (oldProps) {
        if (oldProps && this.props && oldProps.moves.length === this.props.moves.length) {
            return;
        }
        var s = $(ReactDOM.findDOMNode(this.refs.scroll));
        s.scrollTop(s.prop("scrollHeight"));
    },
    render: function () {
        var self = this;
        return <div className="well move-history">
            <h5>Move History</h5>
            <div ref="scroll" style={{
                maxHeight: '25em',
                overflowX: 'show',
                overflowY: 'scroll',
            }}>{pairsOf(this.props.moves).map(function (pair, i) {

                var moveEntries = pair.map(function (obj) {
                    return <MoveEntry
                            move={obj.elem}
                            isSelected={obj.idx === self.props.selectedMoveIdx}
                            onClick={function () {
                                self.props.onSelectMove(obj.idx);
                            }} />
                });

                if (pair.length === 2) {
                    return <div key={i} style={{margin: 0, padding: 0, display: 'flex'}}>
                        <div style={{display: 'inline-block', paddingLeft: 10, paddingRight: 10, backgroundColor: 'lightgrey', width: '3em', textAlign: 'right'}}>{i+1}</div>
                        {moveEntries[0]}
                        {moveEntries[1]}
                    </div>
                } else {
                    return <div key={i} style={{margin: 0, padding: 0, display: 'flex'}}>
                        <div style={{display: 'inline-block', paddingLeft: 10, paddingRight: 10, backgroundColor: 'lightgrey', width: '3em', textAlign: 'right'}}>{i+1}</div>
                        {moveEntries[0]}
                    </div>
                }
            })}</div>
        </div>
    }
});