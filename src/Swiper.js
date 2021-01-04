'use strict';

import React, { PureComponent } from 'react';
import {View} from 'react-native';
import ViewPager from './ViewPager';
import PropTypes from 'prop-types';
import Indicator from './Swiper.Indicator';

const VIEWPAGER_REF = 'VIEWPAGER';
const INDICATOR_REF = 'INDICATOR_REF';

class Swiper extends PureComponent {
    static propTypes = {
        ...ViewPager.propTypes,
        loop: PropTypes.bool,
        autoplay: PropTypes.bool,
        interval: PropTypes.number,
        indicator:PropTypes.bool
    };

    static defaultProps = {
        initialPage: 0,
        interval: 5000,
        loop: false,
        autoplay: false,
        keyboardDismissMode: 'on-drag',
        scrollEnabled: true,
        indicator:true
    };
    constructor(props) {
        super(props);
        this.state = {

        }
        this._timeout;
        this._validate(props);
        this._selectedIndex = this._initialPage;

    }
    componentDidMount() {
        if (this.props.autoplay) {
            this._play();
        }
    }

    componentWillUnmount() {
        this._stop();
    }

    _validate(props) {
      let { children, initialPage } = props;
      const childrenCount = React.Children.count(children);
      this._pageCount = childrenCount;

      if (props.loop && childrenCount > 1) {
          let first = children[0];
          let last = children[childrenCount - 1];
          first = React.createElement(first.type, first.props);
          last = React.createElement(last.type, last.props);
          children = React.Children.map(children, function (child) {
              return child;
          })
          children.push(first);
          children.unshift(last);
          initialPage++;
      }
      this._initialPage = initialPage;
      this._children = children;
    }

    _play() {
        this._timeout = setTimeout(() => {
            clearTimeout(this._timeout);
            this.nextPage();
            this._play();
        }, this.props.interval);
    }
    _stop() {
        clearTimeout(this._timeout);
    }

    _notifyPageChanged(page: number) {
      const outerEvent = { nativeEvent: { position: page } };
      this.refs[INDICATOR_REF]&&this.refs[INDICATOR_REF].onPageSelected(outerEvent)
      this.props.onPageSelected && this.props.onPageSelected(outerEvent);
    }

    _onPageScrollStateChange(state){
        if(state!=='idle'){
            this._stop();
        }else if(this.props.autoplay){
            this._play();
        }
        this.props.onPageScrollStateChanged&&this.props.onPageScrollStateChanged(state);
    }
    _onPageSelected(e) {
      const { position } = e.nativeEvent;
      this._selectedIndex = position;
      let page = this._page(position);
      if (this.props.loop && this._pageCount > 1) {
          if (position === 0) {
            // Let's add a timeout to show smooth transition when switching to first/last position
            setTimeout(() => {
              this.setPageWithoutAnimation(this._pageCount-1);
            }, 200);
          } else if (position === this._pageCount + 1) {
            setTimeout(() => {
              this.setPageWithoutAnimation(0);
            }, 200);
          } else {
            this._notifyPageChanged(page);
          }
      } else {
        this._notifyPageChanged(page);
      }
    }
    _onPageScroll(e) {
        const { position, offset } = e.nativeEvent;
        const page = this._page(position);
        const outerEvent = { nativeEvent: { position: page, offset } };
        this.refs[INDICATOR_REF]&&this.refs[INDICATOR_REF].onPageScroll(outerEvent);
        this.props.onPageScroll && this.props.onPageScroll(outerEvent);
    }
    _position(page: number): number {
        if (this.props.loop && this._pageCount > 1) {
            return page+1;
        }
        return page;
    }

    _page(position: number): number {
        if (this.props.loop && this._pageCount > 1) {
            if (position == 0) {
                return  this._pageCount - 1;
            } else if (position == this._pageCount + 1) {
                return 0;
            } else {
                return position-1;
            }
        }
        return position;
    }

    setPageWithoutAnimation(p: number) {
        const selectedPage = this._position(p);
        this.refs[VIEWPAGER_REF].setPageWithoutAnimation(selectedPage);
    }

    setPage(p: number) {
      const selectedPage = this._position(p);
      this.refs[VIEWPAGER_REF].setPage(selectedPage);
    }

    /**
     * Goto next page with animation
     */
    nextPage() {
      const page = this._page(this._selectedIndex) + 1;
      this.setPage(page);
    }

    /**
     * Goto prev page with animation
     */
    prevPage() {
      const page = this._page(this._selectedIndex) - 1;
      this.setPage(page);
    }

    render() {
        this._validate(this.props);
        const viewpagerProps = {
            ...this.props,
            onPageSelected: (e) => this._onPageSelected(e),
            onPageScroll: (e) => this._onPageScroll(e),
            onPageScrollStateChange:(state)=>this._onPageScrollStateChange(state),
            children: this._children,
            initialPage: this._initialPage,
            ref: VIEWPAGER_REF,
            style: { flex: 1 }
        }
        const style = [
            this.props.style,
            {
                flexDirection: 'column',
                justifyContent: undefined,
                alignItems: undefined
            }
        ]
        return <View
            style={style}
            onLayout={this.props.onLayout} >
            <ViewPager
                {...viewpagerProps} />
            {this.props.indicator&&<Indicator
                ref = {INDICATOR_REF}
                initialPage = {this.props.initialPage}
                count={this._pageCount} />}
        </View>


    }

}

export default Swiper;