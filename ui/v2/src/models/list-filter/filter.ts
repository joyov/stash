import queryString from "query-string";
import {
  FindFilterType,
  PerformerFilterType,
  ResolutionEnum,
  SceneFilterType,
  SceneMarkerFilterType,
  SortDirectionEnum,
} from "../../core/generated-graphql";
import { Criterion, ICriterionOption } from "./criteria/criterion";
import { FavoriteCriterion, FavoriteCriterionOption } from "./criteria/favorite";
import { HasMarkersCriterion, HasMarkersCriterionOption } from "./criteria/has-markers";
import { IsMissingCriterion, IsMissingCriterionOption } from "./criteria/is-missing";
import { NoneCriterionOption } from "./criteria/none";
import { PerformersCriterion, PerformersCriterionOption } from "./criteria/performers";
import { RatingCriterion, RatingCriterionOption } from "./criteria/rating";
import { ResolutionCriterion, ResolutionCriterionOption } from "./criteria/resolution";
import { StudiosCriterion, StudiosCriterionOption } from "./criteria/studios";
import { SceneTagsCriterionOption, TagsCriterion, TagsCriterionOption } from "./criteria/tags";
import { makeCriteria } from "./criteria/utils";
import {
  DisplayMode,
  FilterMode,
} from "./types";

interface IQueryParameters {
  sortby?: string;
  sortdir?: string;
  disp?: string;
  q?: string;
  p?: string;
  c?: string[];
}

// TODO: handle customCriteria
export class ListFilterModel {
  public filterMode: FilterMode = FilterMode.Scenes;
  public searchTerm?: string;
  public currentPage = 1;
  public itemsPerPage = 40;
  public sortDirection: "asc" | "desc" = "asc";
  public sortBy?: string;
  public sortByOptions: string[] = [];
  public displayMode: DisplayMode = DisplayMode.Grid;
  public displayModeOptions: DisplayMode[] = [];
  public criterionOptions: ICriterionOption[] = [];
  public criteria: Array<Criterion<any, any>> = [];
  public totalCount: number = 0;

  public constructor(filterMode: FilterMode) {
    switch (filterMode) {
      case FilterMode.Scenes:
        if (!!this.sortBy === false) { this.sortBy = "date"; }
        this.sortByOptions = ["title", "path", "rating", "date", "filesize", "duration", "framerate", "bitrate", "random"];
        this.displayModeOptions = [
          DisplayMode.Grid,
          DisplayMode.List,
          DisplayMode.Wall,
        ];
        this.criterionOptions = [
          new NoneCriterionOption(),
          new RatingCriterionOption(),
          new ResolutionCriterionOption(),
          new HasMarkersCriterionOption(),
          new IsMissingCriterionOption(),
          new TagsCriterionOption(),
          new PerformersCriterionOption(),
          new StudiosCriterionOption(),
        ];
        break;
      case FilterMode.Performers:
        if (!!this.sortBy === false) { this.sortBy = "name"; }
        this.sortByOptions = ["name", "height", "birthdate", "scenes_count"];
        this.displayModeOptions = [
          DisplayMode.Grid,
          DisplayMode.List,
        ];
        this.criterionOptions = [
          new NoneCriterionOption(),
          new FavoriteCriterionOption(),
        ];
        break;
      case FilterMode.Studios:
        if (!!this.sortBy === false) { this.sortBy = "name"; }
        this.sortByOptions = ["name", "scenes_count"];
        this.displayModeOptions = [
          DisplayMode.Grid,
        ];
        this.criterionOptions = [
          new NoneCriterionOption(),
        ];
        break;
      case FilterMode.Galleries:
        if (!!this.sortBy === false) { this.sortBy = "path"; }
        this.sortByOptions = ["path"];
        this.displayModeOptions = [
          DisplayMode.List,
        ];
        this.criterionOptions = [
          new NoneCriterionOption(),
        ];
        break;
      case FilterMode.SceneMarkers:
        if (!!this.sortBy === false) { this.sortBy = "title"; }
        this.sortByOptions = ["title", "seconds", "scene_id", "random", "scenes_updated_at"];
        this.displayModeOptions = [
          DisplayMode.Wall,
        ];
        this.criterionOptions = [
          new NoneCriterionOption(),
          new TagsCriterionOption(),
          new SceneTagsCriterionOption(),
          new PerformersCriterionOption(),
        ];
        break;
      default:
        this.sortByOptions = [];
        this.displayModeOptions = [];
        this.criterionOptions = [
          new NoneCriterionOption(),
        ];
        break;
    }
    if (!!this.displayMode === false) { this.displayMode = this.displayModeOptions[0]; }
    this.sortByOptions = [...this.sortByOptions, "created_at", "updated_at"];
  }

  public configureFromQueryParameters(rawParms: any) {
    const params = rawParms as IQueryParameters;
    if (params.sortby !== undefined) {
      this.sortBy = params.sortby;
    }
    if (params.sortdir === "asc" || params.sortdir === "desc") {
      this.sortDirection = params.sortdir;
    }
    if (params.disp !== undefined) {
      this.displayMode = parseInt(params.disp, 10);
    }
    if (params.q !== undefined) {
      this.searchTerm = params.q;
    }
    if (params.p !== undefined) {
      this.currentPage = Number(params.p);
    }

    if (params.c !== undefined) {
      this.criteria = [];

      let jsonParameters: any[];
      if (params.c instanceof Array) {
        jsonParameters = params.c;
      } else {
        jsonParameters = [params.c];
      }

      for (const jsonString of jsonParameters) {
        const encodedCriterion = JSON.parse(jsonString);
        const criterion = makeCriteria(encodedCriterion.type);
        criterion.value = encodedCriterion.value;
        criterion.modifier = encodedCriterion.modifier;
        this.criteria.push(criterion);
      }
    }
  }

  public makeQueryParameters(): string {
    const encodedCriteria: string[] = [];
    this.criteria.forEach((criterion) => {
      const encodedCriterion: any = {};
      encodedCriterion.type = criterion.type;
      encodedCriterion.value = criterion.value;
      encodedCriterion.modifier = criterion.modifier;
      const jsonCriterion = JSON.stringify(encodedCriterion);
      encodedCriteria.push(jsonCriterion);
    });

    const result = {
      sortby: this.sortBy,
      sortdir: this.sortDirection,
      disp: this.displayMode,
      q: this.searchTerm,
      p: this.currentPage,
      c: encodedCriteria,
    };
    return queryString.stringify(result, {encode: false});
  }

  // TODO: These don't support multiple of the same criteria, only the last one set is used.

  public makeFindFilter(): FindFilterType {
    return {
      q: this.searchTerm,
      page: this.currentPage,
      per_page: this.itemsPerPage,
      sort: this.sortBy,
      direction: this.sortDirection === "asc" ? SortDirectionEnum.Asc : SortDirectionEnum.Desc,
    };
  }

  public makeSceneFilter(): SceneFilterType {
    const result: SceneFilterType = {};
    this.criteria.forEach((criterion) => {
      switch (criterion.type) {
        case "rating":
          const crit = criterion as RatingCriterion;
          result.rating = { value: crit.value, modifier: crit.modifier };
          break;
        case "resolution": {
          switch ((criterion as ResolutionCriterion).value) {
            case "240p": result.resolution = ResolutionEnum.Low; break;
            case "480p": result.resolution = ResolutionEnum.Standard; break;
            case "720p": result.resolution = ResolutionEnum.StandardHd; break;
            case "1080p": result.resolution = ResolutionEnum.FullHd; break;
            case "4k": result.resolution = ResolutionEnum.FourK; break;
          }
          break;
        }
        case "hasMarkers":
          result.has_markers = (criterion as HasMarkersCriterion).value;
          break;
        case "isMissing":
          result.is_missing = (criterion as IsMissingCriterion).value;
          break;
        case "tags":
          result.tags = (criterion as TagsCriterion).value.map((tag) => tag.id);
          break;
        case "performers":
          result.performer_id = (criterion as PerformersCriterion).value[0].id; // TODO: Allow multiple
          break;
        case "studios":
          result.studio_id = (criterion as StudiosCriterion).value[0].id; // TODO: Allow multiple
          break;
      }
    });
    return result;
  }

  public makePerformerFilter(): PerformerFilterType {
    const result: PerformerFilterType = {};
    this.criteria.forEach((criterion) => {
      switch (criterion.type) {
        case "favorite":
          result.filter_favorites = (criterion as FavoriteCriterion).value === "true";
          break;
      }
    });
    return result;
  }

  public makeSceneMarkerFilter(): SceneMarkerFilterType {
    const result: SceneMarkerFilterType = {};
    this.criteria.forEach((criterion) => {
      switch (criterion.type) {
        case "tags":
          result.tags = (criterion as TagsCriterion).value.map((tag) => tag.id);
          break;
        case "sceneTags":
          result.scene_tags = (criterion as TagsCriterion).value.map((tag) => tag.id);
          break;
        case "performers":
          result.performers = (criterion as PerformersCriterion).value.map((performer) => performer.id);
          break;
      }
    });
    return result;
  }
}
