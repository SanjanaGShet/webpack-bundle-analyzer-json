/** @jsx h */
import { h, Component } from 'preact';
import FoamTree from 'carrotsearch.foamtree';

export default class Treemap extends Component {

  constructor(props) {
    super(props);
    this.treemap = null;
    this.zoomOutDisabled = false;
  }

  componentDidMount() {
    this.setWeightProp(this.props.weightProp);
    this.treemap = this.createTreemap();
    window.addEventListener('resize', this.treemap.resize, false);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setWeightProp(nextProps.weightProp, nextProps.data);
      this.treemap.set({
        dataObject: { groups: nextProps.data }
      });
    } else if (nextProps.weightProp !== this.props.weightProp) {
      this.setWeightProp(nextProps.weightProp);
      this.update();
    } else if (nextProps.highlightedGroupIds !== this.props.highlightedGroupIds) {
      const redrawGroupIds = (this.props.highlightedGroupIds || []).concat(nextProps.highlightedGroupIds || []);
      this.treemap.redraw(false, redrawGroupIds);
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.treemap.resize);
    this.treemap.dispose();
  }

  render() {
    return (
      <div {...this.props} ref={this.saveNode}/>
    );
  }

  saveNode = node => (this.node = node);

  createTreemap() {
    const component = this;
    const { props } = this;
    let zoomOutDisabled = false;

    return new FoamTree({
      element: this.node,
      layout: 'squarified',
      stacking: 'flattened',
      pixelRatio: window.devicePixelRatio || 1,
      maxGroupLevelsDrawn: Number.MAX_VALUE,
      maxGroupLabelLevelsDrawn: Number.MAX_VALUE,
      groupLabelVerticalPadding: 0.2,
      rolloutDuration: 0,
      pullbackDuration: 0,
      fadeDuration: 0,
      zoomMouseWheelDuration: 300,
      openCloseDuration: 200,
      dataObject: {
        groups: this.props.data
      },
      groupColorDecorator: this.groupColorDecorator,
      titleBarDecorator(opts, props, vars) {
        vars.titleBarShown = false;
      },
      onGroupClick(event) {
        // preventDefault(event);

        if (event.ctrlKey || event.metaKey) {
          if (component.props.onGroupCtrlClick) {
            component.props.onGroupCtrlClick(event);
          }
        } else {
          zoomOutDisabled = false;
          this.zoom(event.group);
        }
      },
      onGroupDoubleClick(event) {
        console.log('double');
        preventDefault(event);
      },
      onGroupHover(event) {
        // Ignoring hovering on `FoamTree` branding group
        if (event.group && event.group.attribution) {
          event.preventDefault();
          return;
        }

        if (props.onGroupHover) {
          props.onGroupHover.call(component, event);
        }
      },
      onGroupMouseWheel(event) {
        const isZoomOut = (event.delta < 0);

        if (isZoomOut) {
          if (zoomOutDisabled) return preventDefault(event);
          if (this.get('viewport').scale < 1) {
            zoomOutDisabled = true;
            preventDefault(event);
          }
        } else {
          zoomOutDisabled = false;
        }
      }
    });
  }

  update() {
    this.treemap.update();
  }

  resize() {
    this.treemap.resize();
  }

  setWeightProp(prop, data) {
    data = data || this.props.data;

    data.forEach(setProp);

    function setProp(group) {
      group.weight = group[prop];

      if (group.groups) {
        group.groups.forEach(setProp);
      }
    }
  }

  groupColorDecorator = (opts, params, vars) => {
    if (params.group.id && this.props.highlightedGroupIds.includes(params.group.id)) {
      vars.groupColor = '#f00';
    }
  }

}

function preventDefault(event) {
  event.preventDefault();
}