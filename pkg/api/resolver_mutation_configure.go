package api

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/stashapp/stash/pkg/manager/config"
	"github.com/stashapp/stash/pkg/models"
	"github.com/stashapp/stash/pkg/utils"
)

func (r *mutationResolver) ConfigureGeneral(ctx context.Context, input models.ConfigGeneralInput) (*models.ConfigGeneralResult, error) {
	if len(input.Stashes) > 0 {
		for _, stashPath := range input.Stashes {
			exists, err := utils.DirExists(stashPath)
			if !exists {
				return makeConfigGeneralResult(), err
			}
		}
		config.Set(config.Stash, input.Stashes)
	}

	if input.DatabasePath != nil {
		ext := filepath.Ext(*input.DatabasePath)
		if ext != ".db" && ext != ".sqlite" && ext != ".sqlite3" {
			return makeConfigGeneralResult(), fmt.Errorf("invalid database path, use extension db, sqlite, or sqlite3")
		}
		config.Set(config.Database, input.DatabasePath)
	}

	if input.GeneratedPath != nil {
		if err := utils.EnsureDir(*input.GeneratedPath); err != nil {
			return makeConfigGeneralResult(), err
		}
		config.Set(config.Generated, input.GeneratedPath)
	}

	if err := config.Write(); err != nil {
		return makeConfigGeneralResult(), err
	}

	return makeConfigGeneralResult(), nil
}

func (r *mutationResolver) ConfigureInterface(ctx context.Context, input models.ConfigInterfaceInput) (*models.ConfigInterfaceResult, error) {
	css := ""

	if input.CSS != nil {
		css = *input.CSS
	}

	config.SetCSS(css)

	if input.CSSEnabled != nil {
		config.Set(config.CSSEnabled, *input.CSSEnabled)
	}

	if err := config.Write(); err != nil {
		return makeConfigInterfaceResult(), err
	}

	return makeConfigInterfaceResult(), nil
}
