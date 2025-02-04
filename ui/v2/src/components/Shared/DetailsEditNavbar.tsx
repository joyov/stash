import {
  Alert,
  Button,
  FileInput,
  Menu,
  MenuItem,
  Navbar,
  NavbarDivider,
  Popover,
} from "@blueprintjs/core";
import _ from "lodash";
import React, { FunctionComponent, useState } from "react";
import { Link } from "react-router-dom";
import * as GQL from "../../core/generated-graphql";
import { NavigationUtils } from "../../utils/navigation";

interface IProps {
  performer?: Partial<GQL.PerformerDataFragment>;
  studio?: Partial<GQL.StudioDataFragment>;
  isNew: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onImageChange: (event: React.FormEvent<HTMLInputElement>) => void;

  // TODO: only for performers.  make generic
  onDisplayFreeOnesDialog?: () => void;
}

export const DetailsEditNavbar: FunctionComponent<IProps> = (props: IProps) => {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState<boolean>(false);

  function renderEditButton() {
    if (props.isNew) { return; }
    return (
      <Button
        intent="primary"
        text={props.isEditing ? "Cancel" : "Edit"}
        onClick={() => props.onToggleEdit()}
      />
    );
  }

  function renderSaveButton() {
    if (!props.isEditing) { return; }
    return <Button intent="success" text="Save" onClick={() => props.onSave()} />;
  }

  function renderDeleteButton() {
    if (props.isNew || props.isEditing) { return; }
    return <Button intent="danger" text="Delete" onClick={() => setIsDeleteAlertOpen(true)} />;
  }

  function renderImageInput() {
    if (!props.isEditing) { return; }
    return <FileInput text="Choose image..." onInputChange={props.onImageChange} inputProps={{accept: ".jpg,.jpeg"}} />;
  }

  function renderScraperMenu() {
    if (!props.performer) { return; }
    if (!props.isEditing) { return; }
    const scraperMenu = (
      <Menu>
        <MenuItem
          text="FreeOnes"
          onClick={() => { if (props.onDisplayFreeOnesDialog) { props.onDisplayFreeOnesDialog(); }}}
        />
      </Menu>
    );
    return (
      <Popover content={scraperMenu} position="bottom">
        <Button text="Scrape with..."/>
      </Popover>
    );
  }

  function renderScenesButton() {
    if (props.isEditing) { return; }
    let linkSrc: string = "#";
    if (!!props.performer) {
      linkSrc = NavigationUtils.makePerformerScenesUrl(props.performer);
    } else if (!!props.studio) {
      linkSrc = NavigationUtils.makeStudioScenesUrl(props.studio);
    }
    return (
      <Link className="bp3-button" to={linkSrc}>
        Scenes
      </Link>
    );
  }

  function renderDeleteAlert() {
    var name;

    if (props.performer) {
      name = props.performer.name;
    }
    if (props.studio) {
      name = props.studio.name;
    }

    return (
      <Alert
        cancelButtonText="Cancel"
        confirmButtonText="Delete"
        icon="trash"
        intent="danger"
        isOpen={isDeleteAlertOpen}
        onCancel={() => setIsDeleteAlertOpen(false)}
        onConfirm={() => props.onDelete()}
      >
        <p>
          Are you sure you want to delete {name}?
        </p>
      </Alert>
    );
  }


  return (
    <>
    {renderDeleteAlert()}
    <Navbar>
      <Navbar.Group>
        {renderEditButton()}
        {props.isEditing && !props.isNew ? <NavbarDivider /> : undefined}
        {renderScraperMenu()}
        {renderImageInput()}
        {renderSaveButton()}

        {renderScenesButton()}
        {renderDeleteButton()}
      </Navbar.Group>
    </Navbar>
    </>
  );
};
