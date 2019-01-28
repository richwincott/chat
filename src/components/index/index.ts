import '../home';
import '../room';
import IndexConfig from './index.routes';

declare var angular: any;

export default angular.module('index', ['home', 'room'])
    .config(IndexConfig);