
import * as React from "react";
import * as classNames from "classnames";

import {connect} from "./connect";

import doesEventMeanBackground from "./does-event-mean-background";

import * as actions from "../actions";
import GameActions from "./game-actions";

import {IGameRecord} from "../types";
import {IAction, multiDispatcher} from "../constants/action-types";

export class HubItem extends React.Component<IHubItemProps, IHubItemState> {
  constructor () {
    super();
    this.state = {
      hover: false,
    };
  }

  render () {
    const {game, searchScore} = this.props;
    const {title, coverUrl, stillCoverUrl} = game;
    const {navigateToGame} = this.props;

    let gif: boolean;
    const coverStyle: React.CSSProperties = {};
    if (coverUrl) {
      if (this.state.hover) {
        coverStyle.backgroundImage = `url('${coverUrl}')`;
      } else {
        if (stillCoverUrl) {
          gif = true;
          coverStyle.backgroundImage = `url('${stillCoverUrl}')`;
        } else {
          coverStyle.backgroundImage = `url('${coverUrl}')`;
        }
      }
    }

    const actionProps = {game, showSecondary: this.state.hover};
    const itemClasses = classNames("hub-item", {dull: (searchScore && searchScore > 0.2)});

    return <div className={itemClasses}
        onMouseEnter={this.onMouseEnter.bind(this)}
        onMouseLeave={this.onMouseLeave.bind(this)}>
      {gif
        ? <span className="gif-marker">gif</span>
        : ""
      }
      <section className="cover" style={coverStyle} onClick={(e) => navigateToGame(game, doesEventMeanBackground(e))}/>

      <section className="undercover">
        <section className="title">
          {title}
        </section>

        <GameActions {...actionProps}/>
      </section>
    </div>;
  }

  onMouseEnter () {
    this.setState({hover: true});
  }

  onMouseLeave () {
    this.setState({hover: false});
  }
}

interface IHubItemProps {
  game: IGameRecord;
  searchScore?: number;

  navigateToGame: typeof actions.navigateToGame;
}

interface IHubItemState {
  /** true if mouse is over this hub item */
  hover: boolean;
}

const mapStateToProps = () => ({});

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HubItem);
